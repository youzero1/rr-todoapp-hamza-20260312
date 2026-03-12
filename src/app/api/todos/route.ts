import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { Todo } from '@/entities/Todo';

export async function GET() {
  try {
    const dataSource = await getDataSource();
    const todoRepository = dataSource.getRepository(Todo);
    const todos = await todoRepository.find({
      order: { createdAt: 'DESC' },
    });
    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    console.error('GET /api/todos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const dataSource = await getDataSource();
    const todoRepository = dataSource.getRepository(Todo);

    const todo = todoRepository.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      completed: false,
    });

    const savedTodo = await todoRepository.save(todo);
    return NextResponse.json(savedTodo, { status: 201 });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
