import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Author } from './author.schema';
import { Book } from './book.schema';

export type ImageMetadataDocument = HydratedDocument<ImageMetadata>;

@Schema()
export class ImageMetadata {
  @Prop({ type: Types.ObjectId, ref: Author.name, required: false })
  author?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Book.name, required: false })
  book?: Types.ObjectId;

  @Prop({ required: true })
  imageName: string;

  @Prop({ required: true })
  imagePath: string;
}

export const ImageMetadataSchema = SchemaFactory.createForClass(ImageMetadata);
