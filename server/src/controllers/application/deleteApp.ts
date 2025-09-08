import { Request, Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { objectIdSchema } from '../../utils/zodUtil';


export const deleteAppValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema,
  })
});

export async function deleteApp(req: Request, res: Response, next: NextFunction) {
  const applicationId: string = (req.query.applicationId as string).trim();

  const application: IApplication & Document | null = await Application.findById(applicationId).exec();
  if (!application) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  await application.deleteOne().exec();

  return res.status(200).json({
    success: true,
  });
}