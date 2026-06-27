package com.raisetimeline.api.post;

import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface PostMapper {

    @Select("SELECT p.id, p.user_id, u.display_name, p.content, p.created_at, p.updated_at"
            + " FROM posts p JOIN users u ON p.user_id = u.id"
            + " ORDER BY p.id DESC LIMIT #{limit}")
    List<PostResponse> findLatest(@Param("limit") int limit);

    @Select("SELECT p.id, p.user_id, u.display_name, p.content, p.created_at, p.updated_at"
            + " FROM posts p JOIN users u ON p.user_id = u.id"
            + " WHERE p.id < #{cursor} ORDER BY p.id DESC LIMIT #{limit}")
    List<PostResponse> findBefore(@Param("cursor") Long cursor, @Param("limit") int limit);

    @Select("SELECT p.id, p.user_id, u.display_name, p.content, p.created_at, p.updated_at"
            + " FROM posts p JOIN users u ON p.user_id = u.id"
            + " WHERE p.id > #{sinceId} ORDER BY p.id DESC")
    List<PostResponse> findNewerThan(@Param("sinceId") Long sinceId);

    @Select("SELECT COUNT(*) FROM posts WHERE id > #{sinceId}")
    long countNewerThan(@Param("sinceId") Long sinceId);

    @Select("SELECT p.id, p.user_id, u.display_name, p.content, p.created_at, p.updated_at"
            + " FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = #{id}")
    Optional<PostResponse> findById(@Param("id") Long id);

    @Insert("INSERT INTO posts (user_id, content, created_at, updated_at)"
            + " VALUES (#{userId}, #{content}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Post post);

    @Update("UPDATE posts SET content = #{content}, updated_at = NOW() WHERE id = #{id}")
    void update(@Param("id") Long id, @Param("content") String content);

    @Delete("DELETE FROM posts WHERE id = #{id}")
    void delete(@Param("id") Long id);
}
