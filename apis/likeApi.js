import axios from "axios";

// 좋아요 등록
function createLike(boardId) {
    return axios.post(`/apis/likes/${boardId}`);
}

// 좋아요 취소
function deleteLike(boardId) {
    return axios.delete(`/apis/likes/${boardId}`);
}

export default {
    createLike,
    deleteLike
};