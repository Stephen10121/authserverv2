import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "./entity/User";
import { hash,  compare } from "bcryptjs";
import { MyContext } from "./MyContext";
import { createAccessToken, createRefreshToken } from "./auth";

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
    bye() {
        return "by!"
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

        res.cookie("G_VAR", createRefreshToken(user), {httpOnly: true})

        return {
            accessToken: createAccessToken(user)
        };
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string,
    ) {
        const hashedPassword = await hash(password, 3);

        try {
            console.log(email, hashedPassword);
            await User.insert({
                usersName: "123",
                usersRName: "Jeff",
                usersEmail: email,
                usersPhone: "240",
                usersPassword: hashedPassword,
                users2FA: "false",
                usersHash: "ej4wnrjk3"
            });
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }
}