/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import $ from 'jquery'

import CloudUploadIcon from '@material-ui/icons/CloudUpload'
import DeleteIcon from '@material-ui/icons/Delete'

import defaultImage from '/../assets/images/default.svg'

import styles from './file-input.module.css'

export default function FileInputComponent(props) {
  //Function return file (default null)
  const onChangeFiles = props.onChangeFiles || null
  //Function return status file delete (default null)
  const onDeleteFiles = props.onDeleteFiles || null
  //Function of react-hook-form (default null and not required)
  const register = props.register || null
  //Function error (default null)
  const onErrorFiles = props.onErrorFiles || null

  //Number MB (default 5 MB)
  const maxFileSize = props.maxFileSize || 5
  //Boolean size priority (default false)
  const sizePriority = props.sizePriority || false
  //Boolean (default true)
  const showPreviews = props.showPreviews || true
  //Array file type support example ["png", "jpg", "gif", "bmp", "jpeg"] (default [] = support all files)
  const acceptedFiles = props.acceptedFiles || []
  //Number (default -1 = unlimited files)
  const filesLimit = props.filesLimit || -1
  //Array file default (default [])
  const initialFiles = props.initialFiles || []
  //String placeholder input file
  const placeholder =
    props.placeholder || filesLimit > 1 ? 'Chọn files...' : 'Chọn file...'
  //Array object custom file preview (default null)
  const filesPreviewCustom = props.filesPreviewCustom || null

  const [isShowInput, setShowInput] = useState(true)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  //Initialization initialFiles default
  useEffect(() => {
    if (initialFiles.length > 0) {
      let _initialFiles = initialFiles.filter((file) => file)
      _initialFiles = _initialFiles.map((file) => {
        if (file instanceof Object) {
          let _filePreview = onGetFilePreview(file.fileType, file.filePreview)
          return {
            fileId: newGuid(),
            fileName: file.fileName || null,
            fileSize: file.fileSize || null,
            fileType: file.fileType || null,
            filePreview: _filePreview,
            fileData: null
          }
        } else {
          let _filePreview = onGetFilePreview(null, file)
          return {
            fileId: newGuid(),
            fileName: null,
            fileSize: null,
            fileType: null,
            filePreview: _filePreview,
            fileData: null
          }
        }
      })
      setFiles(_initialFiles)
    }
  }, [])

  //Refresh tag input when files change
  useEffect(() => {
    if (files.length === 0) {
      setShowInput(false)
      setTimeout(() => {
        setShowInput(true)
      }, 1)
    }
  }, [files])

  const newGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const bytesToSize = (bytes) => {
    if (bytes === 0) return 0
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2)
  }

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const handleOpenFile = () => {
    if (isShowInput) {
      $('#fileInput').click()
    }
  }

  const onSetError = (msg = null) => {
    onErrorFiles && onErrorFiles(msg)
    setError(msg)
  }

  const onGetFilePreview = (fileType = null, _filePreviewDefault = null) => {
    if (!fileType) return _filePreviewDefault
    let _preview =
      filesPreviewCustom &&
      filesPreviewCustom.length > 0 &&
      filesPreviewCustom.find(
        (item) =>
          item.fileType &&
          item.fileType.toLowerCase() === fileType.toLowerCase()
      )

    if (_preview && _preview.filePreview) {
      return _preview.filePreview
    }

    return _filePreviewDefault
  }

  const setDefaultErrorImage = (event, imageDefault = defaultImage) => {
    event.target.onerror = null
    event.target.src = imageDefault
  }

  const handleChangeFiles = (e) => {
    if (e && e.target && e.target.files) {
      let _files = Array.from(e.target.files)

      if (sizePriority === true) {
        let totalSize = 0

        files.map((file) => {
          if (file.fileSize !== null) {
            totalSize += file.fileSize
          }
        })

        _files.map((file) => {
          if (file.size) {
            totalSize += file.size
          }
        })

        if (bytesToSize(totalSize) > maxFileSize * 1000) {
          onSetError(
            `Tổng dung lượng files không được vượt quá ${filesLimit} MB.`
          )
          return
        }
      }

      if (filesLimit > 1 && files.length + _files.length > filesLimit) {
        onSetError(`Tải lên tối đa ${filesLimit} files`)
        return
      }

      let _filesResult = []
      let validateMsg = ''

      _files.forEach((file) => {
        if (validateFile(file)) {
          validateMsg = validateFile(file)
        } else {
          _filesResult.push(file)
        }
      })

      if (validateMsg) {
        onSetError(validateMsg)
        return
      }

      Promise.all(
        _filesResult.map((file) => {
          return new Promise((resolve, reject) => {
            if (file.type.includes('image')) {
              let reader = new FileReader()
              reader.addEventListener('load', (ev) => {
                let _filePreview = onGetFilePreview(file.type, ev.target.result)
                resolve({
                  fileId: newGuid(),
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  filePreview: _filePreview,
                  fileData: file
                })
              })
              reader.addEventListener('error', reject)
              reader.readAsDataURL(file)
            } else {
              let _filePreview = onGetFilePreview(file.type)
              resolve({
                fileId: newGuid(),
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                filePreview: _filePreview,
                fileData: file
              })
            }
          })
        })
      ).then(
        (filesResult) => {
          let _filesResult = []

          if (filesLimit > 1) {
            _filesResult = files.concat(filesResult)
          } else {
            _filesResult = filesResult
            if (initialFiles.length > 0) {
              onDeleteFiles && onDeleteFiles(true)
            }
          }
          onSetError('')
          setFiles(_filesResult)
          onChangeFiles &&
            onChangeFiles(
              filesLimit > 1
                ? _filesResult.map((file) => {
                    return file.fileData
                  })
                : _filesResult[0].fileData
            )
        },
        (error) => {
          console.error(error)
        }
      )
    }
  }

  const validateFile = (
    file,
    acceptFileExtensions = acceptedFiles,
    maximumSize = maxFileSize
  ) => {
    if (!file) {
      return 'File không được để trống.'
    }

    if (bytesToSize(file.size) > maximumSize * 1000) {
      return `Kích thước file không được vượt quá ${maximumSize} MB.`
    }

    if (
      file.name !== null &&
      file.name !== '' &&
      file.name !== undefined &&
      acceptFileExtensions &&
      acceptFileExtensions.length > 0
    ) {
      let fileExt = file.name.replace(/^.*\./, '')
      if (
        !acceptFileExtensions.some(
          (x) => x.toUpperCase() === fileExt.toUpperCase()
        )
      ) {
        return `File cho phép tải lên: ${acceptFileExtensions.toString()}`
      }
    }

    return ''
  }

  const handleDeleteFile = (_fileId = null) => {
    if (!_fileId) return
    let filesResult = files.filter((file) => file.fileId !== _fileId)

    onSetError('')
    setFiles(filesResult)
    onChangeFiles &&
      onChangeFiles(
        filesLimit > 1
          ? filesResult.map((file) => {
              return file.fileData
            })
          : null
      )
    onDeleteFiles &&
      onDeleteFiles(
        files.find((file) => file.fileId === _fileId && file.fileData)
      )
  }

  const renderSingleFilePreview = (file) => {
    return (
      <div
        key={file.fileId}
        className={`${styles['file-preview-frame']} ${styles['krajee-default']} ${styles['kv-preview-thumb']}`}
      >
        <div
          className={`${styles['kv-file-content']} ${
            !file.filePreview ? styles['kv-file-content-custom'] : ''
          }`}
        >
          <img
            src={file.filePreview ? file.filePreview : defaultImage}
            onError={setDefaultErrorImage}
            alt={file.fileName || ''}
            title={file.fileName || ''}
            className={`${styles['file-preview-image']} ${styles['kv-preview-data']}`}
          />
        </div>
        <div className={styles['file-thumbnail-footer']}>
          <div
            className={styles['file-footer-caption']}
            title={file.fileName || ''}
          >
            <div className={styles['file-caption-info']}>
              {file.fileName || ''}
            </div>
            <div className={styles['file-size-info']}>
              {file.fileSize !== null && (
                <samp>({formatBytes(file.fileSize)})</samp>
              )}
            </div>
          </div>
          <div className={styles['file-actions']}>
            <div className={styles['file-footer-buttons']}>
              <button
                type='button'
                className={`kv-file-remove btn btn-sm ${styles['btn-kv']} btn-default btn-outline-secondary`}
                title='Gỡ bỏ'
                onClick={() => handleDeleteFile(file.fileId)}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMultipleFilePreview = (file) => {
    return (
      <div
        key={file.fileId}
        className={`${styles['file-preview-frame']} ${styles['krajee-default']} ${styles['kv-preview-thumb']}`}
      >
        <div
          className={`${styles['kv-file-content']} ${
            !file.filePreview ? styles['kv-file-content-custom'] : ''
          }`}
        >
          <img
            src={file.filePreview ? file.filePreview : defaultImage}
            onError={setDefaultErrorImage}
            alt={file.fileName || ''}
            title={file.fileName || ''}
            className={`${styles['file-preview-image']} ${styles['kv-preview-data']}`}
          />
        </div>
        <div className={styles['file-thumbnail-footer']}>
          <div
            className={styles['file-footer-caption']}
            title={file.fileName || ''}
          >
            <div className={styles['file-caption-info']}>
              {file.fileName || ''}
            </div>
            <div className={styles['file-size-info']}>
              {file.fileSize !== null && (
                <samp>({formatBytes(file.fileSize)})</samp>
              )}
            </div>
          </div>
          <div className={styles['file-actions']}>
            <div className={styles['file-footer-buttons']}>
              <button
                type='button'
                className={`kv-file-remove btn btn-sm ${styles['btn-kv']} btn-default btn-outline-secondary`}
                title='Gỡ bỏ'
                onClick={() => handleDeleteFile(file.fileId)}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderInputFile = () => {
    let _acceptedFiles =
      acceptedFiles && acceptedFiles.length > 0
        ? acceptedFiles
            .map((item) => {
              return '.' + item
            })
            .toString()
        : ''

    //Required file
    if (register !== null) {
      let _required = files && files.length === 0 ? true : false
      return (
        <input
          id='fileInput'
          name='fileInput'
          ref={register({
            required: _required
          })}
          type='file'
          className={styles['input-file']}
          accept={_acceptedFiles}
          multiple={filesLimit && filesLimit > 1}
          onChange={handleChangeFiles}
        />
      )
    }

    //Not required file
    return (
      <input
        id='fileInput'
        name='fileInput'
        type='file'
        className={styles['input-file']}
        accept={_acceptedFiles}
        multiple={filesLimit && filesLimit > 1}
        onChange={handleChangeFiles}
      />
    )
  }

  return (
    <div className={styles['file-input']}>
      <div className={styles['file-preview']}>
        <div
          className={`${styles['file-drop-zone']} ${styles['clearfix']} ${styles['clickable']}`}
        >
          <div
            className={styles['file-drop-zone-title']}
            onClick={handleOpenFile}
          >
            {placeholder} <br />
            <CloudUploadIcon style={{ fontSize: 55 }} />
          </div>
          {showPreviews && (
            <div
              className={`${styles['file-preview-thumbnails']} ${
                styles[
                  files.length === 1 ? 'one-file-preview' : 'multi-file-preview'
                ]
              }`}
            >
              {files.length === 1
                ? renderSingleFilePreview(files[0])
                : files.map((file) => renderMultipleFilePreview(file))}
            </div>
          )}
          {error && (
            <div
              className={`${styles['kv-fileinput-error']} ${styles['file-error-message']}`}
            >
              {error}
            </div>
          )}
          {isShowInput && renderInputFile()}
        </div>
      </div>
    </div>
  )
}
