import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import * as Buttons from '../components/Buttons';
import { SlCalender } from "react-icons/sl";
import { IoPersonOutline } from "react-icons/io5";
import { FaRegHeart, FaRegEye } from "react-icons/fa";
import ToastMessage from './ToastMessage';
import Pagination from './Pagination';

const token = localStorage.getItem("token");
const isLoggedIn = !!token;

const fetchWithToken = async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Network response was not ok for ${url}`);
    }

    return response.json();
};

const PostCard = () => {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [successLabel, setSuccessLabel] = useState(''); 
    const [errorLabel, setErrorLabel] = useState(''); 
    const postsPerPage = 3;

    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const currentPageParam = queryParams.get('page');
    const [currentPage, setCurrentPage] = useState(currentPageParam ? Number(currentPageParam) : 1);

    const createClick = () => {
        if (!isLoggedIn) {
          setErrorLabel('로그인 회원만 게시글 작성이 가능합니다.');
          return;
        }
        navigate('/post/create');
        setSuccessLabel('새 게시글 작성 페이지로 이동했습니다.');
      };

    const iconStyle = {
        color: '#96A98B',
        margin: '0px 10px 0px 25px',
        fontSize: '14px',
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsData = await fetchWithToken(`${process.env.REACT_APP_API_ENDPOINT}/api/posts`);
                const sortedPosts = postsData.sort((a, b) => b.id - a.id);
                setPosts(sortedPosts);
                setFilteredPosts(sortedPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setErrorLabel('게시글을 가져오는 중 오류가 발생했습니다.');
            }
        };

        const fetchUsers = async () => {
            try {
                const usersData = await fetchWithToken(`${process.env.REACT_APP_API_ENDPOINT}/api/accounts`);
                setUsers(usersData);
            } catch (error) {
                // console.error('Error fetching users:', error);
                // setErrorLabel('사용자 정보를 가져오는 중 오류가 발생했습니다.');
            }
        };
        fetchPosts();
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = posts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPosts(filtered);
        setCurrentPage(1);
    }, [searchTerm, posts]);

    useEffect(() => {
        const url = new URL(window.location);
        url.searchParams.set('page', currentPage);
        window.history.pushState({}, '', url);
    }, [currentPage]);

    const navigateToPost = (postId) => {
        navigate(`/post/${postId}`, { state: { page: currentPage } });
    };

    const truncateContent = (content, length) => {
        if (!content) return '';
        if (content.length <= length) {
            return content;
        }
        return content.substring(0, length) + '...';
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Loading ..';

        const date = new Date(isoString);

        if (isNaN(date)) return 'Loading ..';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const handleShare = async (postId) => {
        const postUrl = `${window.location.origin}/post/${postId}`;
        try {
            await navigator.clipboard.writeText(postUrl);
            setSuccessLabel('🥑 게시글 주소가 복사되었습니다.');
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = postUrl;
            textArea.style.position = 'fixed'; 
            textArea.style.opacity = 0; 
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setSuccessLabel('🥑 게시글 주소가 복사되었습니다.');
            } catch (fallbackErr) {

            }
            document.body.removeChild(textArea);
        }
    };


    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    const clearLabels = () => {
        setSuccessLabel('');
        setErrorLabel('');
    };

    return (
        <div>
            <div className="SearchContainer">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <Buttons.CreateBtn
                    label="게시글 작성"
                    onClick={createClick}
                />
            </div>
            <div className="PostCardsContainer">
                {currentPosts.map((post) => {
                    const { id, userId, title, article, postPicture, likes, createAt, views } = post;
                    const postcardDate = formatDate(createAt)
                    const author = Array.isArray(users) ? users.find(user => user.userId === userId) : undefined;
                    const authorName = author ? author.nickname : 'Unknown';

                    return (
                        <div key={id} className="PostCard">
                            <div className="postCardContent">
                                <div className="postCardImgPreviewContainer">
                                    <div className="postCardImgPreview">
                                        <img src={postPicture} alt="CardPreview"/>
                                    </div>
                                </div>
                                <div className="postCardDetails">
                                    <div className="PostCardMeta">
                                        <div className="postCardMetaContent">
                                            <SlCalender style={iconStyle}/>
                                            <p>{postcardDate}</p>
                                            <IoPersonOutline style={iconStyle}/>
                                            <p>{authorName}</p>
                                            <FaRegHeart style={iconStyle}/>
                                            <p>{likes}</p>
                                            <FaRegEye style={iconStyle}/>
                                            <p>{views}</p>

                                        </div>
                                    </div>
                                    <div className="PostCardTopArea">
                                        <p>{truncateContent(title, 24)}</p>
                                        <div className="postCardContentPreview">
                                            <p>{truncateContent(article, 80)}</p>
                                        </div>
                                    </div>
                                    <div className="postCardBottomArea">
                                        <div
                                            className="navigateButton"
                                            onClick={() => navigateToPost(id)}
                                        >
                                            자세히 보기
                                        </div>
                                        <div className="postCardShareBtn" onClick={() => handleShare(id)}>
                                            <img src='https://lh3.google.com/u/0/d/1GqffKqgSitn0exrg2f_3D1EV55dUq4AP=w2612-h1714-iv1' alt='Share'/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Pagination
                postsPerPage={postsPerPage}
                totalPosts={filteredPosts.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
            />
            <ToastMessage successLabel={successLabel} errorLabel={errorLabel} clearLabels={clearLabels} />
        </div>
    );
};

export default PostCard;
