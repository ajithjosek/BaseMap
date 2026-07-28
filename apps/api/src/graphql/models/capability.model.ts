import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Capability {
  @Field(() => ID)
  id: string;

  @Field()
  tenant_id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  level: number;

  @Field({ nullable: true })
  parent_id?: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
