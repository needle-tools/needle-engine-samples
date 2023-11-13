
export enum PersonMode {
    none = 0,
    FirstPerson = 1 << 0,
    ThirdPerson = 1 << 1,
    All = FirstPerson | ThirdPerson
}
