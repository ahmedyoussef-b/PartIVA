"""Tests de non-régression SWIG pour place_footprints.py (stdlib unittest).

Reproduit le crash `TypeError: 'SwigPyObject' object is not iterable` observé
quand `fp.Pads()` est appelé après mutation du plateau par KiCad 10.0.x.
"""

import importlib.util
import os
import unittest

MODULE_PATH = os.path.join(os.path.dirname(__file__), "place_footprints.py")
spec = importlib.util.spec_from_file_location("place_footprints_under_test", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class Vec:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class Pad:
    def __init__(self, number, x, y):
        self.number = number
        self.pos = Vec(x, y)

    def GetNumber(self):
        return self.number

    def GetPosition(self):
        return self.pos


class DegradedPads:
    """Proxy SWIG retourné après mutation : non itérable."""

    def __iter__(self):
        raise TypeError("'SwigPyObject' object is not iterable")


class FakeFootprint:
    def __init__(self, pads):
        self._pads = pads
        self.mutated = False

    def Pads(self):
        return DegradedPads() if self.mutated else self._pads

    def mutate(self):
        self.mutated = True


class FakePcbnew:
    class PCB_VIA:
        pass

    class VECTOR2I:
        def __init__(self, x, y):
            self.x = x
            self.y = y


class Track:
    def __init__(self, start, end):
        self.start = Vec(*start)
        self.end = Vec(*end)

    def GetStart(self):
        return self.start

    def GetEnd(self):
        return self.end

    def SetStart(self, value):
        self.start = value

    def SetEnd(self, value):
        self.end = value


class Via(Track, FakePcbnew.PCB_VIA):
    def GetPosition(self):
        return self.start

    def SetPosition(self, value):
        self.start = value


class Board:
    def __init__(self, tracks):
        self.tracks = tracks

    def GetTracks(self):
        return self.tracks


class CapturePadPositionsTest(unittest.TestCase):
    def test_capture_avant_mutation_et_deplacement_sans_swig(self):
        old = FakeFootprint([Pad("1", 1000, 2000), Pad("2", 3000, 4000)])
        old_pads = mod.capture_pad_positions(old)
        self.assertEqual(old_pads, {"1": (1000, 2000), "2": (3000, 4000)})

        new = FakeFootprint([Pad("1", 1500, 2000), Pad("2", 3500, 4000)])
        new_pads = mod.capture_pad_positions(new)

        # Mutation du plateau : les proxies SWIG deviennent non itérables.
        old.mutate()
        new.mutate()
        with self.assertRaises(TypeError):
            iter(old.Pads())

        track = Track((1000, 2000), (9000, 9000))
        via = Via((3000, 4000), (3000, 4000))
        board = Board([track, via])

        moved = mod.move_connected_tracks(board, old_pads, new_pads, FakePcbnew)

        self.assertEqual(moved, 2)
        self.assertEqual((track.start.x, track.start.y), (1500, 2000))
        self.assertEqual((track.end.x, track.end.y), (9000, 9000))
        self.assertEqual((via.start.x, via.start.y), (3500, 4000))

    def test_proxy_degrade_ne_fait_pas_echouer_la_capture(self):
        degraded = FakeFootprint([Pad("1", 1, 2)])
        degraded.mutate()
        self.assertEqual(mod.capture_pad_positions(degraded), {})

    def test_aucun_delta_ne_deplace_rien(self):
        pads = {"1": (1000, 2000)}
        track = Track((5000, 5000), (6000, 6000))
        board = Board([track])
        self.assertEqual(mod.move_connected_tracks(board, pads, pads, FakePcbnew), 0)
        self.assertEqual((track.start.x, track.start.y), (5000, 5000))


if __name__ == "__main__":
    unittest.main()
