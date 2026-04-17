package com.shyam.dgs.graphql.users.repository;

import com.shyam.dgs.graphql.users.entities.BookEntity;
import org.springframework.data.repository.CrudRepository;

public interface BookRepository extends CrudRepository<BookEntity, Long> {
}
