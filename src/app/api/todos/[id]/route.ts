import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { Todo } from '@/entities/Todo';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const dataSource = await getDataSource();
    const todoRepository = dataSource.getRepository(Todo);

    const todo = await todoRepository.findOneBy({ id });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (typeof body.completed === 'boolean') {
      todo.completed = body.completed;
    }
    if (typeof body.title === 'string' && body.title.trim() !== '') {
      todo.title = body.title.trim();
    }
    if (body.description !== undefined) {
      todo.description = body.description ? body.description.trim() : null;
    }

    const updatedTodo = await todoRepository.save(todo);
    return NextResponse.json(updatedTodo, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/todos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const dataSource = await getDataSource();
    const todoRepository = dataSource.getRepository(Todo);

    const todo = await todoRepository.findOneBy({ id });
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    await todoRepository.remove(todo);
    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
