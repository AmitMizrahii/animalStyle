import { UserMongoRepository } from "./dal";
import { AnimalPostMongoRepository } from "./dal/repositories/AnimalPostMongoRepository";
import { CommentMongoRepository } from "./dal/repositories/CommentMongoRepository";

export const userRepository = new UserMongoRepository();
export const commentRepository = new CommentMongoRepository();
export const postRepository = new AnimalPostMongoRepository(commentRepository);
