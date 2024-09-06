import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
    private tasks: Task[] = [];

    constructor(
        @InjectRepository(Task)
        private tasksRepository: MongoRepository<Task>,
    ) { }

    async getAllTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
        const { status, search } = filterDto;

        const query = this.tasksRepository.createQueryBuilder('task');

        query.where({ user });

        if (status) {
            query.andWhere('task.status = :status', { status: 'OPEN' });
        }

        if (search) {
            query.andWhere('(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
                { search: `%${search}%` })
        }

        const tasks = await query.getMany();
        return tasks;
    }

    async getTaskById(id: string, user: User): Promise<Task> {
        const found = await this.tasksRepository.findOne({ where: { id, user } });

        if (!found) {
            throw new NotFoundException(`Task with ID ${id} not found!`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
        const { title, description } = createTaskDto;

        const task = this.tasksRepository.create({
            title,
            description,
            status: TaskStatus.OPEN,
            user
        });

        await this.tasksRepository.save(task);

        return task;
    }

    async deleteTask(id: string, user: User): Promise<boolean> {
        const result = await this.tasksRepository.delete({ id, user });

        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID ${id} not found!`);
        }

        return true;
    }

    async updateTaskStatus(id: string, status: TaskStatus, user: User): Promise<Task> {
        const task = await this.getTaskById(id, user);

        task.status = status;
        await this.tasksRepository.save(task);

        return task;
    }
}
