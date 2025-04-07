import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('energy_consumption');
    const energyData = await db.collection('energy_data').find({}).toArray();
    return NextResponse.json(energyData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch energy data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db('energy_consumption');
    const result = await db.collection('energy_data').insertOne(data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add energy data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('energy_consumption');
    const result = await db.collection('energy_data').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete energy data' }, { status: 500 });
  }
} 