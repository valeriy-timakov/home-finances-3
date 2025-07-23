import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../../../utils/password';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json({ message: 'Email, username and password are required' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Use a transaction to create both User and Agent
    const result = await prisma.$transaction(async (prisma) => {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
        },
      });

      // Create agent for the user
      await prisma.agent.create({
        data: {
          id: user.id, // Use the same ID as the user
        },
      });

      return user;
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = result;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    const status = error.message.includes('already exists') ? 400 : 500;
    return NextResponse.json({ 
      message: status === 400 ? error.message : 'Internal server error' 
    }, { status });
  }
}
