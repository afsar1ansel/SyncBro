import prisma from '../config/prisma.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    console.log(`👤 User connected: ${userId} (Socket: ${socket.id})`);

    // ─── join-room ─────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      try {
        let membership = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId, roomId } },
          include: { user: { select: { name: true, avatarUrl: true } } }
        });

        // If not a member, auto-join as VIEWER (Link-only access)
        if (!membership) {
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Auto-create membership
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, avatarUrl: true }
          });
          
          membership = await prisma.roomMember.create({
            data: { userId, roomId, role: 'VIEWER' },
            include: { user: { select: { name: true, avatarUrl: true } } }
          });
        }

        // Store user info on socket for later use
        socket.data.user.name = membership.user.name;
        socket.data.user.avatarUrl = membership.user.avatarUrl;
        socket.data.roomId = roomId;

        socket.join(roomId);
        console.log(`🚪 User ${membership.user.name} joined room: ${roomId}`);

        // Load existing widgets and send to the joining user
        const widgets = await prisma.widget.findMany({ where: { roomId } });

        socket.emit('room-joined', { roomId, role: membership.role, widgets });
        socket.to(roomId).emit('user-joined', {
          userId,
          name: membership.user.name,
          avatarUrl: membership.user.avatarUrl
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── cursor-move ───────────────────────────────────────────────────────
    socket.on('cursor-move', ({ x, y }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit('cursor-update', {
        userId,
        name: socket.data.user.name,
        avatarUrl: socket.data.user.avatarUrl,
        x,
        y,
      });
    });

    // ─── widget-placed ─────────────────────────────────────────────────────
    socket.on('widget-placed', async ({ x, y }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      try {
        // Get current max z in this room
        const maxZ = await prisma.widget.aggregate({
          where: { roomId },
          _max: { z: true },
        });
        const nextZ = (maxZ._max.z ?? 0) + 1;

        const widget = await prisma.widget.create({
          data: {
            roomId,
            type: 'STICKER', // Generic Box → mapped to STICKER
            x,
            y,
            z: nextZ,
            data: { label: 'Box' },
          },
        });

        // Emit to everyone including sender
        io.to(roomId).emit('widget-added', { widget });
        console.log(`📦 Widget placed in room ${roomId} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
      } catch (error) {
        console.error('Error placing widget:', error);
      }
    });

    // ─── widget-moved ──────────────────────────────────────────────────────
    socket.on('widget-moved', async ({ widgetId, x, y }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      try {
        await prisma.widget.update({
          where: { id: widgetId },
          data: { x, y },
        });
        socket.to(roomId).emit('widget-moved', { widgetId, x, y });
      } catch (error) {
        console.error('Error moving widget:', error);
      }
    });

    // ─── widget-focused ────────────────────────────────────────────────────
    socket.on('widget-focused', async ({ widgetId }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      try {
        const maxZ = await prisma.widget.aggregate({
          where: { roomId },
          _max: { z: true },
        });
        const nextZ = (maxZ._max.z ?? 0) + 1;

        await prisma.widget.update({
          where: { id: widgetId },
          data: { z: nextZ },
        });
        io.to(roomId).emit('widget-focused', { widgetId, z: nextZ });
      } catch (error) {
        console.error('Error focusing widget:', error);
      }
    });

    // ─── disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('user-left', { userId });
      }
      console.log(`👤 User disconnected: ${userId} (Socket: ${socket.id})`);
    });
  });
};
