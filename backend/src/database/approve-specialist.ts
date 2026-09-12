import 'reflect-metadata';
import 'dotenv/config';
import { z } from 'zod';
import { appDataSource } from './data-source';
import { User } from '../modules/auth/user.entity';

async function run(){
  const email=z.string().email().parse(process.env.SPECIALIST_EMAIL).toLowerCase();
  await appDataSource.initialize();
  const user=await appDataSource.getRepository(User).findOne({where:{email},relations:{profile:true}});
  if(!user||!user.profile) throw new Error('Specialist not found');
  if(!user.profile.professionalLicense) throw new Error('Professional license is missing');
  user.active=true; user.approvedAt=new Date(); await appDataSource.getRepository(User).save(user);
  console.log(`Specialist approved: ${email}`);
}
run().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;}).finally(async()=>{if(appDataSource.isInitialized)await appDataSource.destroy();});
