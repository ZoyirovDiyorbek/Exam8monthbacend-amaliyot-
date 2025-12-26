import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from 'src/core/entity/teacher.entity';
import { Student } from 'src/core/entity/student.entity';
import { successRes } from 'src/infrastructure/response/success.response';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      fs.mkdirSync(path.join(this.uploadDir, 'teachers'), { recursive: true });
      fs.mkdirSync(path.join(this.uploadDir, 'students'), { recursive: true });
    }
  }

  async uploadTeacherImage(
    teacherId: string,
    file: any,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Faqat rasm fayllari qabul qilinadi (JPEG, PNG, JPG, WEBP)',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Rasm hajmi 5MB dan oshmasligi kerak');
    }

    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new BadRequestException('Teacher topilmadi');
    }

    if (teacher.imageUrl) {
      const oldImagePath = path.join(process.cwd(), teacher.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, 'teachers', fileName);
    fs.writeFileSync(filePath, file.buffer);
    const imageUrl = `/uploads/teachers/${fileName}`;
    teacher.imageUrl = imageUrl;
    await this.teacherRepo.save(teacher);

    return successRes({
      message: 'Rasm muvaffaqiyatli yuklandi',
      imageUrl,
    });
  }

  async uploadStudentImage(
    studentId: string,
    file: any,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Faqat rasm fayllari qabul qilinadi (JPEG, PNG, JPG, WEBP)',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Rasm hajmi 5MB dan oshmasligi kerak');
    }

    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new BadRequestException('Student topilmadi');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, 'students', fileName);
    fs.writeFileSync(filePath, file.buffer);
    const imageUrl = `/uploads/students/${fileName}`;

    return successRes({
      message: 'Rasm muvaffaqiyatli yuklandi',
      imageUrl,
    });
  }

  async deleteImage(imageUrl: string): Promise<any> {
    if (!imageUrl) {
      throw new BadRequestException('Rasm URL topilmadi');
    }

    const filePath = path.join(process.cwd(), imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return successRes({ message: 'Rasm muvaffaqiyatli o\'chirildi' });
    }

    throw new BadRequestException('Rasm topilmadi');
  }
}

