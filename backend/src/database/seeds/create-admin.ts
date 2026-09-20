import 'reflect-metadata'; import 'dotenv/config';
import { z } from 'zod';
import { appDataSource } from '../data-source';
import { hashPassword } from '../../modules/auth/password';
import { User,UserRole } from '../../modules/auth/user.entity';
const schema=z.object({ADMIN_NAME:z.string().trim().min(2).max(120),ADMIN_EMAIL:z.string().trim().toLowerCase().email(),ADMIN_PASSWORD:z.string().min(12).max(128)});
async function run(){const input=schema.parse(process.env);await appDataSource.initialize();const repo=appDataSource.getRepository(User);let user=await repo.findOneBy({email:input.ADMIN_EMAIL});if(user){user.role=UserRole.ADMIN;user.active=true;user.approvedAt=user.approvedAt??new Date();user.rejectedAt=null;user.rejectionReason=null;await repo.save(user);console.log(`Administrator promoted: ${user.email}`);return;}user=repo.create({name:input.ADMIN_NAME,email:input.ADMIN_EMAIL,phone:null,passwordHash:await hashPassword(input.ADMIN_PASSWORD),role:UserRole.ADMIN,active:true,approvedAt:new Date(),rejectedAt:null,rejectionReason:null,reviewedBy:null});await repo.save(user);console.log(`Administrator created: ${user.email}`);}
run().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;}).finally(async()=>{if(appDataSource.isInitialized)await appDataSource.destroy();});
