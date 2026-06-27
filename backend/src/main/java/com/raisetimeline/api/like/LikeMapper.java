package com.raisetimeline.api.like;

import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface LikeMapper {

    @Insert("INSERT INTO likes (post_id, user_id) VALUES (#{postId}, #{userId})"
            + " ON CONFLICT DO NOTHING")
    void insert(@Param("postId") Long postId, @Param("userId") Long userId);

    @Delete("DELETE FROM likes WHERE post_id = #{postId} AND user_id = #{userId}")
    void delete(@Param("postId") Long postId, @Param("userId") Long userId);

    @Select("SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = #{postId} AND user_id = #{userId})")
    boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);

    @Select("<script>"
            + "SELECT post_id, COUNT(*) AS cnt FROM likes"
            + " WHERE post_id IN"
            + "<foreach item='id' collection='postIds' open='(' separator=',' close=')'>#{id}</foreach>"
            + " GROUP BY post_id"
            + "</script>")
    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);

    @Select("<script>"
            + "SELECT post_id FROM likes"
            + " WHERE user_id = #{userId}"
            + " AND post_id IN"
            + "<foreach item='id' collection='postIds' open='(' separator=',' close=')'>#{id}</foreach>"
            + "</script>")
    List<Long> likedPostIdsByUser(
            @Param("postIds") List<Long> postIds,
            @Param("userId") Long userId);
}
