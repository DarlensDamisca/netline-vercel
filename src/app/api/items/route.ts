import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../../lib/mongo';
import { NextRequest, NextResponse } from 'next/server';

type Item = {
  _id?: string;
  name: string;
};

/* export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db('ronet_database'); // Replace with your database name
    
    if(!req.query.table){
        res.status(401).json({
            error: 'Unauthorized',
        }); 
        return;
    }
    
    // Ensure table is a string
    const table = Array.isArray(req.query.table) ? req.query.table[0] : req.query.table;
    console.log(table);
    if (req.method === 'GET') {
      const items = await db.collection<Item>(table).find({}).toArray();
      res.status(200).json(items);
    } else if (req.method === 'POST') {
      const newItem: Item = req.body;
      const result = await db.collection<Item>(table).insertOne(newItem);
      res.status(201).json(result);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Database connection error' });
  }
} */


export async function GET(request: NextRequest) {
  // Get the table parameter from the URL search params
  const table = request.nextUrl.searchParams.get('table');
  const params = request.nextUrl.searchParams.get('params');
   
  if (!table) {
    return NextResponse.json({ 
      error: 'Table parameter is required' 
    }, { status: 401 }); 
  }

  const client = await clientPromise;
  const db = client.db('netline_database'); // Replace with your actual database name
  const query = params ? JSON.parse(params) : {};

  const items = await db.collection(table).find(query).toArray();
  return NextResponse.json(items, { status: 200 });
}


