import { AuthenticationContext } from '@components/context/AuthenticationContext'
import SiteSocialHeader from '@components/social/SiteSocialHeader'
import type { PageViewMode } from '@models/types/PageViewMode.Type'
import { type IPost, Post, type SiteSocial } from '@services/api'
import getApiClient from '@services/apiInterface'
import { ensureError } from '@services/errors'
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import AnnouncementCard from '../components/AnnouncementCard'
import ContactCard from '../components/ContactCard'
import CreatePostWidget from '../components/CreatePostWidget'
import PostWidget from '../components/social/PostWidget'
import LoadingPage from './LoadingPage'

const SiteSocialPage = () => {
  const { siteId: siteIdParam } = useParams()
  const { currentUser } = useContext(AuthenticationContext)
  const [isLoadingSite, setIsLoadingSite] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [site, setSite] = useState<SiteSocial>()

  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [errorPosts, setErrorPosts] = useState<Error | undefined>(undefined)
  const [posts, setPosts] = useState<Post[]>([])

  const siteId = siteIdParam
    ? Number.parseInt(siteIdParam, 10) || 0
    : 0

  const viewMode: PageViewMode = currentUser
    ? (currentUser.role === 'MegaAdmin' || currentUser.adminSiteIds.includes(siteId))
      ? 'admin'
      : 'user'
    : 'visitor'

  const fetchSiteData = async (parsedSiteId: number) => {
    setIsLoadingSite(true)
    try {
      const fetchedSite = await getApiClient().siteClient.social(parsedSiteId)
      setSite(fetchedSite)
    } catch (error_: unknown) {
      setError(ensureError(error_))
    } finally {
      setIsLoadingSite(false)
    }
  }

  const fetchPosts = async (parsedSiteId: number) => {
    setIsLoadingPosts(true)
    try {
      const fetchedPosts = await getApiClient().postClient.all(parsedSiteId)
      setPosts(fetchedPosts)
    } catch (error_: unknown) {
      setErrorPosts(ensureError(error_))
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const addNewPost = (newPost: Post) => setPosts(previous => [newPost, ...previous])

  const likePost = (postId: number) =>
    setPosts(previous =>
      previous.map(post => {
        const newLikeStatus = !post.hasLiked
        if (post.id === postId) {
          const newCount = newLikeStatus
            ? post.likeCount + 1
            : post.likeCount - 1
          const updatedPost: IPost = {
            ...post,
            hasLiked: newLikeStatus,
            likeCount: newCount,
          }

          return new Post(updatedPost)
        }

        return post
      })
    )

  useEffect((): void => {
    void fetchSiteData(siteId)
    void fetchPosts(siteId)
  }, [siteId])

  if (isLoadingSite) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <div className='bg-white rounded-2 2 py-2'>
        <p>{error.message}</p>
      </div>
    )
  }

  if (!site) return <div />

  return (
    <div className='page-container mt-2 d-flex flex-column gap-4'>
      <SiteSocialHeader site={site} viewMode={viewMode} />

      <div className='row row-gap-4'>
        <div className='col-12 col-md-6 col-lg-5 col-xl-4'>
          <div className='d-flex flex-column gap-4'>
            <AnnouncementCard announcement={site.announcement} viewMode={viewMode} />
            <ContactCard contact={site.contact} viewMode={viewMode} />
          </div>
        </div>

        <div className='col-12 col-md-6 col-lg-7 col-xl-8'>
          <div className='rounded-2 d-flex flex-column gap-4'>
            {viewMode === 'admin' && <CreatePostWidget addNewPost={addNewPost} />}
            <div className='d-flex flex-column gap-4'>
              {isLoadingPosts
                ? (
                  <div className='bg-white rounded-2 2 py-2'>
                    <p>Loading...</p>
                  </div>
                )
                : errorPosts
                ? (
                  <div className='bg-white rounded-2 2 py-2'>
                    <p>{errorPosts.message}</p>
                  </div>
                )
                : posts.map(post => (
                  <PostWidget key={post.id} likePostEvent={likePost} post={post} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SiteSocialPage
