import { NextRequest, NextResponse } from 'next/server';
import { healthSuggestions } from '@/lib/data';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userSuggestions = healthSuggestions.filter(suggestion => suggestion.user_id === user.id);
  
  return NextResponse.json({ suggestions: userSuggestions });
}

export async function PATCH(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await request.json();
    
    const suggestion = healthSuggestions.find(s => s.id === id && s.user_id === user.id);
    if (suggestion) {
      suggestion.read = true;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}