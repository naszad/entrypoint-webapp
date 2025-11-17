import { NextResponse } from 'next/server';
import { fetchUsersByFilterCriteria, addUser, deleteUser, updateUserProfile, updateUserRole } from '@/libs/userService';
import { FilterValue } from '@/components/DataTable/DataTable';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filtersParam = url.searchParams.get('filters');
    const sort = url.searchParams.get('sort');
    const fetchWithCount = url.searchParams.get('fetchWithCount') === 'true';

    let filters: FilterValue[] = [];
    if (filtersParam) {
      filters = filtersParam.split(',').map(filter => {
        const [key, condition, value] = filter.split(':');
        return { key, condition, value };
      });
    }

    const usersResponse = await fetchUsersByFilterCriteria({
      fetchWithCount,
      filters,
      sort,
    });
    return NextResponse.json(usersResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, role } = body;

    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, and role are required' },
        { status: 400 }
      );
    }

    const userId = await addUser({ firstName, lastName, email, role });
    return NextResponse.json({ userId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while adding the user. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await deleteUser(userId);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { profile } = body;


    if (!profile) {
      return NextResponse.json(
        { error: 'Profile parameter is required' },
        { status: 400 }
      );
    }

    const { firstName, lastName, password, currentPassword } = profile;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // If updating password, current password is required
    if (password && !currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required to update password' },
        { status: 400 }
      );
    }

    await updateUserProfile(profile);
    return NextResponse.json({ message: 'User profile updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    await updateUserRole(userId, role);

    return NextResponse.json({ message: 'User role updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}