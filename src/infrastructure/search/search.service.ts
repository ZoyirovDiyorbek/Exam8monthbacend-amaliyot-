import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

@Injectable()
export class SearchService {
  
  applySearch<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    searchTerm: string,
    searchFields: string[],
  ): SelectQueryBuilder<T> {
    if (!searchTerm || !searchFields.length) {
      return queryBuilder;
    }

    const conditions = searchFields
      .map((field, index) => {
        const paramName = `search_${index}`;
        return `LOWER(${field}) LIKE LOWER(:${paramName})`;
      })
      .join(' OR ');

    queryBuilder.andWhere(`(${conditions})`, {
      ...searchFields.reduce((acc, field, index) => {
        acc[`search_${index}`] = `%${searchTerm}%`;
        return acc;
      }, {} as Record<string, string>),
    });

    return queryBuilder;
  }

  
  searchTeachers(
    queryBuilder: SelectQueryBuilder<any>,
    searchTerm: string,
  ): SelectQueryBuilder<any> {
    if (!searchTerm) {
      return queryBuilder;
    }

    return queryBuilder.andWhere(
      '(LOWER(teacher.fullName) LIKE LOWER(:search) OR ' +
        'LOWER(teacher.email) LIKE LOWER(:search) OR ' +
        'LOWER(teacher.specification) LIKE LOWER(:search) OR ' +
        'LOWER(teacher.description) LIKE LOWER(:search))',
      { search: `%${searchTerm}%` },
    );
  }

  
  searchStudents(
    queryBuilder: SelectQueryBuilder<any>,
    searchTerm: string,
  ): SelectQueryBuilder<any> {
    if (!searchTerm) {
      return queryBuilder;
    }

    return queryBuilder.andWhere(
      '(LOWER(student.firstName) LIKE LOWER(:search) OR ' +
        'LOWER(student.lastName) LIKE LOWER(:search) OR ' +
        'LOWER(student.phoneNumber) LIKE LOWER(:search) OR ' +
        'LOWER(student.tgUsername) LIKE LOWER(:search))',
      { search: `%${searchTerm}%` },
    );
  }

  
  searchLessons(
    queryBuilder: SelectQueryBuilder<any>,
    searchTerm: string,
  ): SelectQueryBuilder<any> {
    if (!searchTerm) {
      return queryBuilder;
    }

    return queryBuilder.andWhere(
      '(LOWER(lesson.name) LIKE LOWER(:search))',
      { search: `%${searchTerm}%` },
    );
  }
}

