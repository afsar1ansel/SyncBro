import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { getIO } from '../socket/io.js';

export const createRoom = async (req, res, next) => {
  try {
    const { name, isPublic } = req.body;
    const userId = req.user.id;

    // Generate a simple slug from the name + short uuid
    const slug = `${name.toLowerCase().replace(/ /g, '-')}-${uuidv4().substring(0, 8)}`;

    const room = await prisma.room.create({
      data: {
        name,
        slug,
        isPublic: !!isPublic,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
        owner: {
          select: { name: true }
        }
      },
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const getMyRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { members: { some: { userId } } },
          { isPublic: true },
        ],
      },
      include: {
        owner: {
          select: { name: true }
        }
      },
      orderBy: {
        id: 'desc',
      },
    });

    const io = getIO();
    const roomsWithCount = rooms.map(room => {
      const onlineCount = io?.sockets.adapter.rooms.get(room.id)?.size || 0;
      return {
        ...room,
        onlineCount
      };
    });

    res.status(200).json({ success: true, rooms: roomsWithCount });
  } catch (error) {
    next(error);
  }
};

export const getRoomBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    let room = await prisma.room.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Link-only access: If user is not a member, auto-join them as a VIEWER
    if (room.members.length === 0) {
      await prisma.roomMember.create({
        data: {
          userId,
          roomId: room.id,
          role: 'VIEWER',
        },
      });
      
      // Re-fetch to include the new membership
      room = await prisma.room.findUnique({
        where: { slug },
        include: {
          members: {
            where: { userId },
          },
        },
      });
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Verify room membership (or let the socket handle it, but good to check here)
    const membership = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { timestamp: 'asc' },
      take: 50, // Get last 50 messages
      include: {
        sender: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
