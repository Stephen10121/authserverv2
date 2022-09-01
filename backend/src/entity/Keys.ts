import { Field, Int, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
// import { ObjectType } from "type-graphql";
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
    @Column("text")
    keysAuthenticator: string
}