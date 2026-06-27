package com.raisetimeline.api.comment;

import com.raisetimeline.api.like.PostCount;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CommentMapper {

    @Select("SELECT c.id, c.post_id, c.user_id, u.display_name, c.content, c.created_at, c.updated_at"
            + " FROM comments c JOIN users u ON c.user_id = u.id"
            + " WHERE c.post_id = #{postId} ORDER BY c.id ASC")
    List<CommentResponse> findByPostId(@Param("postId") Long postId);

    @Select("SELECT c.id, c.post_id, c.user_id, u.display_name, c.content, c.created_at, c.updated_at"
            + " FROM comments c JOIN users u ON c.user_id = u.id"
            + " WHERE c.id = #{id}")
    Optional<CommentResponse> findById(@Param("id") Long id);

    @Insert("INSERT INTO comments (post_id, user_id, content, created_at, updated_at)"
            + " VALUES (#{postId}, #{userId}, #{content}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Comment comment);

    @Delete("DELETE FROM comments WHERE id = #{id}")
    void delete(@Param("id") Long id);

    @Select("<script>"
            + "SELECT post_id, COUNT(*) AS cnt FROM comments"
            + " WHERE post_id IN"
            + "<foreach item='id' collection='postIds' open='(' separator=',' close=')'>#{id}</foreach>"
            + " GROUP BY post_id"
            + "</script>")
    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);
}
