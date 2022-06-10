import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { User } from "./entity/User";
import { hash,  compare } from "bcryptjs";
import { MyContext } from "./MyContext";
import { createAccessToken, createRefreshToken } from "./auth";
import { isAuth } from "./isAuth";
import { sendRefreshToken } from "./sendRefreshToken";

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

    @Mutation(() => Boolean)
    async register(
        @Arg('username') username: string,
        @Arg("name") name: string,
        @Arg('email') email: string,
        @Arg("phone") phone: string,
        @Arg('password') password: string,
        @Arg("tfa") tfa: string,
    ) {
        const hashedPassword = await hash(password, 3);

        try {
            console.log(email, hashedPassword);
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
            return false;
        }
        return true;
    }
}