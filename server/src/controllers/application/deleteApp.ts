import { Response, NextFunction } from 'express';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { Application, IApplication } from '../../model/mongo/application';
import z from 'zod';
import { objectIdSchema } from '../../utils/zodUtil';
import { UserAuthRequest } from '../../middleware/authorizationRequired';
import { Postgres } from '../../database/postgres';
import { container } from 'tsyringe';


export const deleteAppValidateSchema = z.object({
  query: z.object({
    applicationId: objectIdSchema,
  })
});

export async function dropAppPartition(applicationId: string) {
  const postgres: Postgres = container.resolve(Postgres);
  const partitionName = `events_app_${applicationId}`;

  await postgres.dataSource.query(`
    DROP TABLE IF EXISTS ${partitionName};
  `);
}

export async function deleteApp(req: UserAuthRequest, res: Response, next: NextFunction) {
  const applicationId: string = (req.query.applicationId as string).trim();

  const application: IApplication & Document | null = await Application.findOne({ _id: applicationId, maintainers: req.user._id }).exec();
  if (!application) {
    return res.status(400).json({ error: responseMessages.APPLICATION_NOT_FOUND });
  }

  await application.deleteOne().exec();
  await dropAppPartition(applicationId);

  return res.status(200).json({
    success: true,
  });
}