import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyPassword } from '../../../lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('netline_database');
    
    // Find the user by username and type only (not password)
    const user = await db.collection('users').findOne({ 
      username: username,
      type: 'SYSTEM_ADMINISTRATOR'
    });

    console.log(user);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify the password separately
    const isPasswordValid = verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Return user data without the password
    const { password: _, ...userData } = user;
    
    return NextResponse.json({
      user: userData,
      message: 'Login successful'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
