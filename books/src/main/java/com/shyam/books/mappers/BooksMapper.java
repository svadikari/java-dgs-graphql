package com.shyam.books.mappers;

import com.shyam.books.entities.BookEntity;
import com.shyam.books.dto.types.Book;
import com.shyam.books.dto.types.CreateBook;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BooksMapper {
    Iterable<Book> toBookDtos(Iterable<BookEntity> bookEntities);
    Book toBookDto(BookEntity bookEntity);
    BookEntity toEntity(CreateBook book);
}
