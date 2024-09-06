import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from "./user.entity";
import { JwtPayload } from "./dto/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private usersRepository: MongoRepository<User>,
    ) {
        super({
            secretOrKey: 'topSecret51',
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