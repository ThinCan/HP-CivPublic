import { IScreen, getElement, UI } from "./UI";
import { v4 } from "uuid"
import CivsJSON from "../json/civinfo.json"
import { IPickedCivilization } from "../Util/GlobalInterfaces";

export default class LoginScreen implements IScreen {
    Close() {
        getElement(".login").style.display = "none"
        getElement(".game-container").style.display = "flex"
    }
    Show() {
        getElement(".login").style.display = "flex"
        getElement(".game-container").style.display = "none"
    }

    private ready = false
    public pickedCiv: IPickedCivilization
    private uiitems = {
        civ: getElement<HTMLSelectElement>("#civ-select"),
        portrait: getElement<HTMLImageElement>(".civ-portrait"),
        civInfo: getElement(".civ-info-text"),

        createForm: getElement(".create-form"),
        joinForm: getElement(".join-form"),
        playerCount: getElement("#player-count"),
        gameCode: getElement("#game-code"),
        gameCreateBtn: getElement(".game-create"),
        gameJoinBtn: getElement(".game-join"),
        notifDiv: getElement(".civ-notify")
    }

    constructor(private ui: UI) {
        this.uiitems.civ.onchange = (e) => this.onCivChange(e)
        this.uiitems.createForm.onsubmit = e => this.onFormSubmit(e)
        this.uiitems.joinForm.onsubmit = e => this.onFormSubmit(e)

        this.uiitems.gameCreateBtn.onclick = this.onGameCreateClick.bind(this)
        this.uiitems.gameJoinBtn.onclick = this.onGameJoinClick.bind(this)
    }

    private onFormSubmit(e: Event) {
        e.preventDefault();
    }
    private onCivChange(e: Event) {
        type CivKey = keyof typeof CivsJSON;
        //@ts-ignore
        const val = (<HTMLSelectElement>e.target).value
        if (!CivsJSON[val as CivKey]) {
            this.ready = false
            this.uiitems.portrait.style.display = "none"
            this.uiitems.civInfo.textContent = ""
            this.pickedCiv = undefined
            return
        }
        this.pickedCiv = { ...CivsJSON[val as CivKey], civname: val as CivKey }
        const info = CivsJSON[val as CivKey]
        this.uiitems.portrait.style.display = "block"
        this.uiitems.portrait.src = `./img/portraits/${val}.png`
        this.uiitems.civInfo.innerHTML = `Przywódca: ${info.leader}<br>${info.desc}`
        this.ready = true
    }
    private onGameCreateClick() {
        const numPlayers = (<HTMLInputElement>this.uiitems.playerCount)
        if (!numPlayers.validity.valid) {
            numPlayers.reportValidity()
            return
        }

        const code = v4().slice(-6)
        this.ui.game.network.CreateGame(+numPlayers.value, code, this.ui.game.map.tilesArray.map(t => t.Serialize()))
        if (!this.pickedCiv) return alert("Wybierz cywilizacje");

        this.uiitems.notifDiv.innerHTML = `Twój kod to: ${code}<br>Oczekiwanie na graczy...`
    }
    private onGameJoinClick() {
        const code = (<HTMLInputElement>this.uiitems.gameCode).value
        if (!this.pickedCiv) return alert("Wybierz cywilizacje")
        this.ui.game.network.JoinGame(code, this.pickedCiv.civname)
    }
    public AppendToNotif(text: string) {
        this.uiitems.notifDiv.innerHTML += "<br>" + text
    }
}