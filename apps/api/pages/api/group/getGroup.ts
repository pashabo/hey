import { Errors } from '@hey/data/errors';
import allowCors from '@utils/allowCors';
import { CACHE_AGE } from '@utils/constants';
import createRedisClient from '@utils/createRedisClient';
import prisma from '@utils/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ success: false, error: Errors.NoBody });
  }

  try {
    const redis = createRedisClient();
    const cache = await redis.get(`group:${slug}`);

    if (cache) {
      return res
        .status(200)
        .setHeader('Cache-Control', CACHE_AGE)
        .json({ success: true, cached: true, result: JSON.parse(cache) });
    }

    const data = await prisma.group.findUnique({
      where: { slug: slug as string }
    });
    await redis.set(`group:${slug}`, JSON.stringify(data));

    return res
      .status(200)
      .setHeader('Cache-Control', CACHE_AGE)
      .json({ success: true, result: data });
  } catch (error) {
    throw error;
  }
};

export default allowCors(handler);
