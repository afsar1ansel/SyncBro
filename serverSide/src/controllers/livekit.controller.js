import { AccessToken } from 'livekit-server-sdk';
import prisma from '../config/prisma.js';

export const getLiveKitToken = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 1. Verify user is a member of the room
    const membership = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }

    // 2. Generate token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: userId,
        name: membership.user.name,
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });

    res.status(200).json({
      success: true,
      token: await at.toJwt(),
      serverUrl: process.env.LIVEKIT_URL,
    });
  } catch (error) {
    next(error);
  }
};
