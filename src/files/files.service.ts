import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
  ) {}

  findAll(userId: number, fileType: FileType, sortOrder: string = 'newest') {
    const qb = this.repository.createQueryBuilder('file');
    qb.where('file.userId = :userId', { userId });

    if (fileType === FileType.PHOTOS) {
      qb.andWhere('file.mimetype ILIKE :type', { type: '%image%' });
    }

    if (fileType === FileType.DOCUMENTS) {
      qb.andWhere('(file.mimetype LIKE :type1 OR file.mimetype LIKE :type2)', {
        type1: 'application/%',
        type2: 'text/%',
      });
    }

    if (fileType === FileType.TRASH) {
      qb.withDeleted().andWhere('file.deletedAt IS NOT NULL');
    }

    if (fileType === FileType.FAVORITE) {
      qb.andWhere('file.favorites = true');
    }

    if (sortOrder === 'oldest') {
      qb.orderBy('file.createdAt', 'ASC');
    } else {
      qb.orderBy('file.createdAt', 'DESC');
    }

    return qb.getMany();
  }

  findFile(id: number, userId: number) {
    const qb = this.repository.createQueryBuilder('file');

    qb.where('file.userId = :userId', { userId });

    qb.andWhere('file.id = :id', { id });
    return qb.getMany();
  }

  async searchFile(keyword: string, userId: number) {
    const qb = this.repository.createQueryBuilder('file');
    qb.where('file.userId = :userId', { userId });

    qb.andWhere('file.originalName LIKE :keyword', { keyword: `%${keyword}%` });

    return qb.getMany();
  }

  create(file: Express.Multer.File, userId: number) {
    return this.repository.save({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      user: { id: userId },
    });
  }

  async remove(userId: number, id: number) {
    const qb = this.repository.createQueryBuilder('file');
    qb.where('id = :id AND userId = :userId', {
      id: id,
      userId,
    });
    return qb.softDelete().execute();
  }

  async toggleFavorites(userId: number, favorites: boolean, id: number) {
    const qb = this.repository.createQueryBuilder('file');
    qb.where('id = :id AND userId = :userId', {
      id: id,
      userId,
    });

    return qb
      .update()
      .set({ favorites: () => 'NOT favorites' })
      .execute();
  }
}
