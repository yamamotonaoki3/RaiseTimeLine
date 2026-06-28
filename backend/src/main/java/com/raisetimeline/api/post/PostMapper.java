package com.raisetimeline.api.post;

import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PostMapper {

    List<PostRow> findLatest(@Param("limit") int limit);

    List<PostRow> findBefore(@Param("cursor") Long cursor, @Param("limit") int limit);

    List<PostRow> findNewerThan(@Param("sinceId") Long sinceId);

    long countNewerThan(@Param("sinceId") Long sinceId);

    Optional<PostRow> findById(@Param("id") Long id);

    void insert(Post post);

    void update(@Param("id") Long id, @Param("content") String content);

    void delete(@Param("id") Long id);

    List<PostRow> findByUserId(@Param("userId") Long userId);
}
