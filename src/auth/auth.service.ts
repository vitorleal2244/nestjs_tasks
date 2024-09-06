import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';
import { JwtPayload } from './dto/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: MongoRepository<User>,
        private jwtService: JwtService,
    ) { }

    async signUp(authCredentialsDto: AuthCredentialsDto): Promise<boolean> {
        const { username, password } = authCredentialsDto;

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = this.usersRepository.create({
            username,
            password: hashedPassword
        });

        try {
            await this.usersRepository.save(user);

            return true;
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Username already exists');
            } else {
                throw new InternalServerErrorException(error);
            }
        }
    }

    async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
        const { username, password } = authCredentialsDto;

        const user = await this.usersRepository.findOne({ where: { username: username } });

        if (user && (await bcrypt.compare(password, user.password))) {
            const payload: JwtPayload = { username };
            const accessToken = await this.jwtService.sign(payload);

            return { accessToken };
        } else {
            throw new UnauthorizedException('Please check your login credentials');
        }
    }
}
