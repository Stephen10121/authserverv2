import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { User } from "./entity/User";
import { hash } from "bcryptjs";

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return "hi!"
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
                email,
                password: hashedPassword
            });
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }
}