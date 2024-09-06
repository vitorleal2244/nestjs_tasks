import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
    private tasks: Task[] = [];

    constructor(
        @InjectRepository(Task)
        private tasksRepository: MongoRepository<Task>,
    ) { }

    async getAllTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
        const { status, search } = filterDto;

        const query = this.tasksRepository.createQueryBuilder('task');

        if (status) {
            query.andWhere('task.status = :status', { status: 'OPEN' });
        }

        if (search) {
            query.andWhere('lOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',
                { search: `%${search}%` })
        }

        const tasks = await query.getMany();
        return tasks;
    }

    async getTaskById(id: string): Promise<Task> {
        const found = await this.tasksRepository.findOne({ where: { id } });

        if (!found) {
            throw new NotFoundException(`Task with ID ${id} not found!`);
        }

        return found;
    }

    async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
        const { title, description } = createTaskDto;

        const task = this.tasksRepository.create({
            title,
            description,
            status: TaskStatus.OPEN
        });

        await this.tasksRepository.save(task);

        return task;
    }

    async deleteTask(id: string): Promise<boolean> {
        const result = await this.tasksRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID ${id} not found!`);
        }

        return true;
    }

    async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
        const task = await this.getTaskById(id);

        task.status = status;
        await this.tasksRepository.save(task);

        return task;
    }
}
