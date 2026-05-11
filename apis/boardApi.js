import axios from "axios";

function boardWrite(formData) {
    return axios.post("/api/boards/create", formData); 
}

function boardRead(boardId) {
    return axios.get("/api/boards/read/" + boardId);
}

function boardUpdate(formData) {
    return axios.put("/api/boards/update", formData);
}

function boardDelete(boardId) {
    return axios.delete("/api/boards/delete/" + boardId);
}

export default {
    boardWrite,
    boardRead,
    boardUpdate,
    boardDelete
}
