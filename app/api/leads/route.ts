import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LeadData {
  name: string;
  phone: string;
  email?: string;
  zip?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json();
    
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const firebaseApp = getFirebaseAdmin();
    const db = firebaseApp.firestore();
    
    const lead = {
      ...body,
      createdAt: new Date().toISOString(),
      source: 'web',
    };

    await db.collection('leads').add(lead);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit lead' },
      { status: 500 }
    );
  }
}
