import axios from "axios";

// 좋아요 등록
function createLike(boardId) {
    return axios.post(`/api/likes/${boardId}`);
}

// 좋아요 취소
function deleteLike(boardId) {
    return axios.delete(`/api/likes/${boardId}`);
}

export default {
    createLike,
    deleteLike
};