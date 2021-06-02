

import React, {useState, useEffect} from 'react';
import "./App.css"
import axios from "axios"
const electron = window.require('electron');
const { desktopCapturer } = electron

/**
 * Адресс для dev версии и рабочей
 * Не стал использовать isDev, так как эти библиотеки постояно устаревают
 **/
// const apiURL = "http://localhost:8000";
const apiURL = "http://162.55.54.115:8000";

function App() {

    /**
     * Все необъодимые состояния, хранятся локально.
     * ID пользователя хранится в localStorage, токенов никаких нет, так как
     * для записи нужен лишь id
     **/
    const [inputLogin, setInputLogin] = useState({
        workEmail: "",
        password: ""
    })
    const [loader, setLoader] = useState(false)
    const [error, setError] = useState(null)
    const [user, setUser] = useState(localStorage.getItem("user"))
    const [infoBB, setInfoBB] = useState({
        merchant: ""
    })
    const [isStarted, setIsStarted] = useState(false)
    const [loginError, setLoginError] = useState(null)


    /**
     * Пользовательские вводы, один для логина
     * Жругой для ввода имени (название компании наверно) поставщика
    **/
    const inputValue = (event) => {
        setInputLogin(prevState => {
            return {...prevState, [event.target.name]: event.target.value}
        })
    }
    const inputMerchant = (event) => {
        setError(null)
        setInfoBB(prevState => {
            return {...prevState, [event.target.name]: event.target.value}
        })
    }

    /**
     * Функция для проверки если предыдущая работа не была закончена
     * То есть если пользователь нажал START, а потом закрыл программу или разлогинился
     * То зайдя обратно там будет гореть кнопка STOP, чтобы завершить начатую работу
     **/
    const checkIfLast = async (userId) => {
        setLoader(true)
        try {
            const response = await axios.get(apiURL + `/bigBrother/${userId}/lastJob`)
            if (response.data.startScreen) {
                setIsStarted(true)
                setInfoBB(response.data)
            } else {
                setIsStarted(false)
                setInfoBB({merchant: ""})
            }
            setLoader(false)
            setError(false)
        } catch (err) {
            console.log(err)
            setLoader(false)
        }

    }

    /**
     * Обычный переключатель вида экрана между START и STOP
     **/
    const toggleIsStarted = () => {
        if (!error) {
            setIsStarted(!isStarted)
        }
    }


    /**
     * ГЛАВНАЯ ФУНКЦИЯ
     * Здесь происходит все то, ради чего работает программа
     * Снимается скриншот (можно снимать также и видео и аудио с устройства, но здесь только скриншот)
     * Собирается FormData с картинкой формата base64, id пользователя и именем поставщика
     * И все это отправляется на сервер
     **/
    const takeAScreenShot = async () => {
        if (infoBB.merchant.trim() === "") {
            setError("Merchant name is required")
            return
        }
         desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: 1280,
                height: 800
            }
        })
            .then( async sources => {
                setLoader(true)
                const screenshotBase64 = await sources[0].thumbnail.toDataURL()
                try {
                    const formData = new FormData()
                    formData.append("image", screenshotBase64)
                    formData.append("merchant", infoBB.merchant)
                    formData.append("user", user)
                    await axios.post(apiURL + '/bigBrother', formData)
                    toggleIsStarted()
                    setError(null)
                    setLoader(false)
                } catch {
                    setError("No internet connection((((")
                }
            })
    }

    /**
     * Логаут пользователя, удаляет id из localStorage
     **/
    const logOut = () => {
        setError(null)
        setLoader(false)
        setIsStarted(false)
        setInfoBB({merchant: ""})
        localStorage.clear()
        setUser(null)
    }
    /**
     * Логин, отправляет имэйл и пароль на сервер, если все хорошо, то присылает в ответ данные пользователя
     **/
    const submitHandler = async (event) => {
        event.preventDefault()
        try {
            const response = await axios.post(apiURL + "/users/electron", inputLogin)
            localStorage.setItem("user", response.data.user._id)
            setLoginError(null)
            setUser(response.data.user._id)
            await checkIfLast(response.data.user._id)

        } catch (e) {
            console.log(e)
            setLoginError("Неправильный email или пароль!")
        }
    }

    /**
     * Проверка на незаконченную заявку при запуске программы. Даже когда еще пользователь не залогинился идет проверка
     * Возможно это стоит убрать, еще не решил, пока проблем с этим нет. А вот если добавлять кучу проверок когда именно запускать проверки на незаконченную работу
     * то тогда может и начнутся проблемы)))
     **/
    useEffect(() => {
        setUser(localStorage.getItem("user"))
        checkIfLast(user)
    }, [user])
    let main

    /**
     * Отрисовка экрана
     * Если есть id юзера, то видим START STOP экран
     * А если нет, то видим форму логина
     **/
    if (user) {
        main = (
            <div className={"BigBrother__bg--top"}>
                {!isStarted ? <input required value={infoBB.merchant} name={"merchant"} onChange={(event) => {inputMerchant(event)}} placeholder={"merchant"} className={"BigBrotherInput"} type={"text"} /> : null}
                {infoBB.merchant.length && isStarted ? <p className={"BigBrother__merchant"}>{infoBB.merchant}</p> : null}
                {/*<img id={"screenshot-image"} />*/}
                {/*<div onClick={bigBrotherDoYourJob} id={"BigBrother"} style={isStarted ? {'background': 'red'} : {'background': 'green'}} className={"BigBrother"}>*/}
                <div onClick={takeAScreenShot} id={"BigBrother"} className={"BigBrother"}>
                    <img className={"BigBrother__image"} src={isStarted ? "./red.gif" : "./green.gif"} />
                    {!error ? <h1 className={"BigBrother__text"}>{isStarted ? "STOP" : "START"}</h1>
                        : <h1 className={"BigBrother__text--error"}>{error}</h1>}
                </div>
                <button onClick={logOut} className={"BigBrotherInput--button BigBrotherInput--button--positioning"}>Log out</button>
                {loader ? <div className={"Loader"} /> : null}
            </div>
        )
    } else {
        main = (
            <div className={"BigBrother__bg--top"}>
                <form onSubmit={(event) => {submitHandler(event)}} className={"BigBrother__form"}>
                    <input required name={"workEmail"} onChange={(event) => {inputValue(event)}} placeholder={"work email"} className={"BigBrotherInput BigBrotherInput--login"} type={"text"} />
                    <input required name={"password"} onChange={(event) => {inputValue(event)}} placeholder={"password"} className={"BigBrotherInput BigBrotherInput--login"} type={"password"} />
                    {loginError ? <p className={"BigBrother__text--loginError"}>{loginError}</p> : null}
                    <button className={"BigBrotherInput--button"} type={"submit"}>Login</button>
                </form>
            </div>
        )
    }
  return (
      <>
          {main}
      </>
  );
}

export default App;
