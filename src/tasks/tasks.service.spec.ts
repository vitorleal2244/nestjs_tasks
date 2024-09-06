import { Test } from "@nestjs/testing";
import { TasksService } from "./tasks.service";

describe('TaskService', () => {
    let tasksService: TasksService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                TasksService,
            ],
        });
    });
});