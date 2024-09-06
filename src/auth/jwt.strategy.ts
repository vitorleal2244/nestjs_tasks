import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from "./user.entity";
import { JwtPayload } from "./dto/jwt-payload.interface";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private usersRepository: MongoRepository<User>,
        private configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const { username } = payload;

        const user: User = await this.usersRepository.findOne({ where: { username: username } });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}