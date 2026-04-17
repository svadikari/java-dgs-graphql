package com.shyam.users.mappers;

import com.shyam.users.dto.types.CreateUser;
import com.shyam.users.dto.types.User;
import com.shyam.users.entities.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UsersMapper {
    Iterable<User> toDtos(Iterable<UserEntity> userEntities);
    User toDto(UserEntity userEntity);
    UserEntity toEntity(CreateUser user);
}
