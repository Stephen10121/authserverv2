import { Field, Int, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
// import { ObjectType } from "type-graphql";

@ObjectType()
@Entity("keysAuthenticator")
export class KeysAuthenticator extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column({ type: "blob", nullable: false })
    credentialID: Buffer

    @Field()
    @Column({ type: "blob", nullable: false })
    credentialPublicKey: Buffer

    @Field()
    @Column("int")
    counter: number

    @Field()
    @Column({ type: "text", nullable: true })
    transports: string;

    @Field()
    @Column("text")
    owner: string

    @Field()
    @Column("boolean")
    blacklist: boolean;

    @Field()
    @Column("text")
    name: string
}

@ObjectType()
@Entity("keys")
export class Key extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column("text")
    keysOwner: string

    @Field()
    @Column("int")
    keysAuthenticator: number
}