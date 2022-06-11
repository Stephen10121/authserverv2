import { Field, Int, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
// import { ObjectType } from "type-graphql";

@ObjectType()
@Entity("sites")
export class Site extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column("text")
    sitesOwner: string

    @Field()
    @Column("text")
    sitesWebsite: string

    @Field()
    @Column("text")
    sitesHash: string
}