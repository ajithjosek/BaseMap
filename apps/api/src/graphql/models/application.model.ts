import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class Application {
  @Field(() => ID)
  id: string;

  @Field()
  tenant_id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  lifecycle_state?: string;

  @Field(() => Float, { nullable: true })
  risk_score?: number;

  @Field({ nullable: true })
  technology_type?: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}
