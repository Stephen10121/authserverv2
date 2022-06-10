import { Arg, Ctx, Field, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { User } from "./entity/User";
import { hash,  compare } from "bcryptjs";
import { MyContext } from "./MyContext";
import { createAccessToken, createRefreshToken } from "./auth";
import { isAuth } from "./isAuth";
import { sendRefreshToken } from "./sendRefreshToken";
import { getConnection } from "typeorm";

@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return "hi!"
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    bye(
        @Ctx() { payload }: MyContext) {
        return `Your id is ${payload!.userId}`;
    }

    @Query(() => [User])
    users() {
        return User.find();
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    async fetchData(@Ctx() { payload }: MyContext): Promise<String> {
        const user = await User.findOne({ where: { id: payload!.userId } });
        if (!user) {
            throw new Error("User doesnt exist");
        }
        const user2 = JSON.stringify(user);
        return user2;
    }

    @Mutation(() => Boolean)
    async revokeRefreshTokensForUser(
        @Arg('userId', () => Int) userId: number
    ) {
        await getConnection().getRepository(User).increment({id: userId}, 'tokenVersion', 1);
        return true;
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg('username') username: string,
        @Arg('password') password: string,
        @Ctx() {res}: MyContext
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: {usersName: username} });

        if (!user) {
            throw new Error("User doesnt exist.");
        }

        const valid = await compare(password, user.usersPassword);
        
        
        if (!valid) {
            throw new Error("Invalid Password");
        }

        sendRefreshToken(res, createRefreshToken(user));

        return {
            accessToken: createAccessToken(user)
        };
    }

    @Mutation(() => String)
    async register(
        @Arg('username') username: string,
        @Arg("name") name: string,
        @Arg('email') email: string,
        @Arg("phone") phone: string,
        @Arg('password') password: string,
        @Arg("tfa") tfa: string,
    ) {
        const user = await User.findOne({ where: {usersName: username} });

        if (user) {
            throw new Error("User already exists.");
        }

        const hashedPassword = await hash(password, 3);

        try {
            await User.insert({
                usersName: username,
                usersRName: name,
                usersEmail: email,
                usersPhone: phone,
                usersPassword: hashedPassword,
                users2FA: tfa,
                usersHash: "ej4wnrjk3"
            });
        } catch (err) {
            console.error(err);
            throw new Error("Error registering user.")
        }

        const userLogged = await User.findOne({ where: {usersName: username} });

        if (!userLogged) {
            throw new Error("Error registering user.")
        }
        const test: string = createAccessToken(userLogged);
        console.log(test);
        return test;
    }
}